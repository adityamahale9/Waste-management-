import os
import uuid
import base64
import logging
from datetime import datetime
from io import BytesIO
from flask import render_template, request, jsonify, redirect, url_for, flash, session
from werkzeug.utils import secure_filename
from PIL import Image
import numpy as np

from app import app, db
from models import WasteImage, RecyclingCenter
from waste_classifier import classify_waste, get_recycling_tips

# Configure upload folder
UPLOAD_FOLDER = 'static/uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """Render the main page with waste detection functionality"""
    return render_template('index.html')

@app.route('/history')
def history():
    """Show the history of waste images and classifications"""
    waste_images = WasteImage.query.order_by(WasteImage.timestamp.desc()).all()
    return render_template('history.html', waste_images=waste_images)

@app.route('/recycling-centers')
def recycling_centers():
    """Show nearby recycling centers on a map"""
    centers = RecyclingCenter.query.all()
    return render_template('recycling_centers.html', centers=centers)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """API endpoint for uploading and classifying waste images"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        if file and allowed_file(file.filename):
            # Generate unique filename
            filename = str(uuid.uuid4()) + '_' + secure_filename(file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
            
            # Process the image for classification
            image = Image.open(filepath)
            waste_type, confidence = classify_waste(image)
            
            # Get recycling tips for the waste type
            tips = get_recycling_tips(waste_type)
            
            # Save to database
            waste_image = WasteImage(
                filename=filename,
                waste_type=waste_type,
                confidence=float(confidence),
                file_size=os.path.getsize(filepath),
                mime_type=file.content_type
            )
            db.session.add(waste_image)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'waste_type': waste_type,
                'confidence': float(confidence),
                'image_url': url_for('static', filename=f'uploads/{filename}'),
                'tips': tips,
                'id': waste_image.id
            })
        
        return jsonify({'error': 'File type not allowed'}), 400
    
    except Exception as e:
        logging.error(f"Error in upload_file: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/webcam', methods=['POST'])
def webcam_upload():
    """API endpoint for processing webcam images"""
    try:
        data = request.json
        if not data or 'image_data' not in data:
            return jsonify({'error': 'No image data received'}), 400
        
        # Process base64 image
        image_data = data['image_data']
        if 'base64,' in image_data:
            image_data = image_data.split('base64,')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        
        # Generate filename and save
        filename = f"webcam_{uuid.uuid4()}.jpg"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        image.save(filepath)
        
        # Classify the waste
        waste_type, confidence = classify_waste(image)
        
        # Get recycling tips
        tips = get_recycling_tips(waste_type)
        
        # Save to database
        waste_image = WasteImage(
            filename=filename,
            waste_type=waste_type,
            confidence=float(confidence),
            file_size=os.path.getsize(filepath),
            mime_type='image/jpeg'
        )
        db.session.add(waste_image)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'waste_type': waste_type,
            'confidence': float(confidence),
            'image_url': url_for('static', filename=f'uploads/{filename}'),
            'tips': tips,
            'id': waste_image.id
        })
    
    except Exception as e:
        logging.error(f"Error in webcam_upload: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/recycling-centers')
def get_recycling_centers():
    """API endpoint to get recycling centers data"""
    centers = RecyclingCenter.query.all()
    return jsonify({
        'centers': [center.to_dict() for center in centers]
    })

@app.route('/api/waste-types')
def get_waste_types():
    """API endpoint to get waste types statistics"""
    result = db.session.query(
        WasteImage.waste_type, 
        db.func.count(WasteImage.id)
    ).group_by(WasteImage.waste_type).all()
    
    return jsonify({
        'waste_types': [{'type': r[0], 'count': r[1]} for r in result]
    })

# Initialize database with sample recycling centers if empty
def initialize_data():
    if RecyclingCenter.query.count() == 0:
        sample_centers = [
            RecyclingCenter(
                name="EcoRecycle Center",
                address="123 Green St, Seattle, WA 98101",
                latitude=47.6062,
                longitude=-122.3321,
                phone="(206) 555-1234",
                website="https://ecorecycle.example.com",
                materials="Plastic, Paper, Metal, Glass"
            ),
            RecyclingCenter(
                name="GreenEarth Recycling",
                address="456 Sustainable Ave, Seattle, WA 98102",
                latitude=47.6152,
                longitude=-122.3261,
                phone="(206) 555-5678",
                website="https://greenearth.example.com",
                materials="E-waste, Batteries, Plastics"
            ),
            RecyclingCenter(
                name="Urban Waste Solutions",
                address="789 Ecology Blvd, Seattle, WA 98103",
                latitude=47.6205,
                longitude=-122.3493,
                phone="(206) 555-9012",
                website="https://urbanwaste.example.com",
                materials="Organic, Compost, Construction materials"
            )
        ]
        
        for center in sample_centers:
            db.session.add(center)
        
        db.session.commit()
        logging.info("Initialized database with sample recycling centers")

# Register a function to run before first request
@app.before_request
def before_request():
    # Use a global variable to ensure we only run initialization once
    if not hasattr(app, '_initialized'):
        with app.app_context():
            initialize_data()
        app._initialized = True
