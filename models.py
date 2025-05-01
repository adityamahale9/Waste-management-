from datetime import datetime
from app import db

class WasteImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    waste_type = db.Column(db.String(50), nullable=False)
    confidence = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Additional metadata
    file_size = db.Column(db.Integer)
    mime_type = db.Column(db.String(50))
    
    def __repr__(self):
        return f"<WasteImage {self.filename} - {self.waste_type}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'waste_type': self.waste_type,
            'confidence': self.confidence,
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'file_size': self.file_size,
            'mime_type': self.mime_type
        }


class RecyclingCenter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    phone = db.Column(db.String(20))
    website = db.Column(db.String(255))
    materials = db.Column(db.String(255))
    
    def __repr__(self):
        return f"<RecyclingCenter {self.name}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'phone': self.phone,
            'website': self.website,
            'materials': self.materials
        }
