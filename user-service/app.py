# user-service/app.py
from flask import Flask, jsonify, request
import redis
import os
import time
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
import json

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Connect to redis
redis_host = os.getenv('REDIS_HOST', 'redis')
redis_port = int(os.getenv('REDIS_PORT', '6379'))
redis_client = redis.StrictRedis(host=redis_host, port=redis_port, decode_responses=True)

# Connect to PostgreSQL
#DATABASE_URL = os.getenv("USER_DATABASE_URL")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/postgres")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# User Model
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat()
        }

# Create tables
Base.metadata.create_all(bind=engine)

# Home
@app.route('/')
def home():
    return jsonify({"Message": "Welcome to User Service API"})

# Get Time
@app.route('/time')
def get_time():
    return jsonify({'time': time.time()})

# Create User
@app.route('/users', methods=['POST'])
def create_user():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    
    if not username or not email:
        return jsonify({"error": "username and email required"}), 400
    
    db = SessionLocal()
    try:
        # Check if user exists in cache first
        cached_user = redis_client.get(f"user:email:{email}")
        if cached_user:
            return jsonify({"error": "User already exists"}), 400
        
        # Create user in database
        user = User(username=username, email=email)
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Cache user
        redis_client.setex(
            f"user:id:{user.id}", 
            300,  # 5 minutes cache
            json.dumps(user.to_dict())
        )
        redis_client.setex(
            f"user:email:{email}", 
            300,  # 5 minutes cache
            json.dumps(user.to_dict())
        )
        
        return jsonify(user.to_dict()), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Get User by ID
@app.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    # Try to get from cache first
    cached_user = redis_client.get(f"user:id:{user_id}")
    if cached_user:
        return jsonify(json.loads(cached_user))
    
    # If not in cache, get from database
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            return jsonify({"error": "User not found"}), 404
        
        # Cache for future requests
        user_dict = user.to_dict()
        redis_client.setex(
            f"user:id:{user_id}", 
            300,  # 5 minutes cache
            json.dumps(user_dict)
        )
        
        return jsonify(user_dict)
    finally:
        db.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
