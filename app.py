from flask import Flask, jsonify, request
import redis
import os

app = Flask(__name__)

#connect to redis
redis_host = os.getenv('REDIS_HOST', 'localhost')
redis_port = int(os.getenv('REDIS_PORT', '6379'))
redis_client = redis.StrictRedis(host=redis_host, port=redis_port, decode_responses=True)

#CREATE: Set a key-value pair
app.route('/cache', methods=['POST'])
def create_cache():
    data = request.json
    key = data.get('key')
    value = data.get('value')

    if not key or not value:
        return jsonify({"error" : "key and value required"}), 400
    redis_client.set(key,value)
    return jsonify({"message" : f"Key {key} set with value {value}"}), 201

#READ: Get a value by key from Redis
app.route('/cache/<key>', methods=['GET'])
def get_cache(key):
    value = redis_client.get(key)

    if value is None:
        return jsonify({"error" : "Key not found"}), 404

    return jsonify({"key" : key , "value" : value})

#DELETE : Remove a key
app.route('/cache/<key>', methods=['DELETE'])
def delete_cache(key):
    if redis_client.delete(key):
        return jsonify({"message" : f"Key {key} deleted"}), 200
    return jsonify({"error" : "Key not found"}), 404
