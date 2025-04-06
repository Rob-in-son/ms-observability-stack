# product-service/app.py
from flask import Flask, jsonify, request
import redis
import os
import time
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from prometheus_flask_exporter import PrometheusMetrics
import datetime
import json

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
metrics = PrometheusMetrics(app)

# Connect to redis
redis_host = os.getenv('REDIS_HOST', 'redis')
redis_port = int(os.getenv('REDIS_PORT', '6379'))
redis_client = redis.StrictRedis(host=redis_host, port=redis_port, decode_responses=True)

# Connect to PostgreSQL
#DATABASE_URL = os.getenv("PRODUCT_DATABASE_URL")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/postgres")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Product Model
class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    price = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price": self.price,
            "created_at": self.created_at.isoformat()
        }

# Create tables
Base.metadata.create_all(bind=engine)

# Home
@app.route('/')
def home():
    return jsonify({"Message": "Welcome to Product Service API"})

# Get Time
@app.route('/time')
def get_time():
    return jsonify({'time': time.time()})

# Create Product
@app.route('/products', methods=['POST'])
def create_product():
    data = request.json
    name = data.get('name')
    description = data.get('description')
    price = data.get('price')
    
    if not name or price is None:
        return jsonify({"error": "name and price required"}), 400
    
    db = SessionLocal()
    try:
        # Create product in database
        product = Product(name=name, description=description, price=price)
        db.add(product)
        db.commit()
        db.refresh(product)
        
        # Cache product
        redis_client.setex(
            f"product:{product.id}", 
            300,  # 5 minutes cache
            json.dumps(product.to_dict())
        )
        
        return jsonify(product.to_dict()), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Get Product by ID
@app.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    # Try to get from cache first
    cached_product = redis_client.get(f"product:{product_id}")
    if cached_product:
        return jsonify(json.loads(cached_product))
    
    # If not in cache, get from database
    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if product is None:
            return jsonify({"error": "Product not found"}), 404
        
        # Cache for future requests
        product_dict = product.to_dict()
        redis_client.setex(
            f"product:{product_id}", 
            300,  # 5 minutes cache
            json.dumps(product_dict)
        )
        
        return jsonify(product_dict)
    finally:
        db.close()

# Get all products
@app.route('/products', methods=['GET'])
def get_products():
    # Try cache first
    cached_products = redis_client.get("all_products")
    if cached_products:
        return jsonify(json.loads(cached_products))
    
    db = SessionLocal()
    try:
        products = db.query(Product).all()
        result = [product.to_dict() for product in products]
        
        # Cache for future requests
        redis_client.setex(
            "all_products", 
            60,  # 1 minute cache (shorter because list might change)
            json.dumps(result)
        )
        
        return jsonify(result)
    finally:
        db.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
