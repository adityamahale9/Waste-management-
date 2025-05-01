import os
import numpy as np
from PIL import Image
import logging

# Disable TensorFlow logging except for errors
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# Configure CPU only for TensorFlow
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# Map of waste types and their recycling tips
WASTE_TYPES = {
    'plastic': {
        'name': 'Plastic',
        'tips': [
            'Rinse containers before recycling',
            'Remove caps and lids',
            'Check the recycling symbol and number',
            'Avoid plastic bags in regular recycling',
            'Reduce plastic use with reusable alternatives'
        ]
    },
    'paper': {
        'name': 'Paper',
        'tips': [
            'Keep paper dry and clean',
            'Remove plastic windows from envelopes',
            'Flatten cardboard boxes',
            'Shredded paper should go in paper bags',
            'Avoid recycling greasy or food-stained paper'
        ]
    },
    'glass': {
        'name': 'Glass',
        'tips': [
            'Rinse thoroughly to remove residue',
            'Remove lids and caps',
            'Sort by color if required by local facilities',
            'Do not include window glass, mirrors, or ceramics',
            'Glass is infinitely recyclable with no loss in quality'
        ]
    },
    'metal': {
        'name': 'Metal',
        'tips': [
            'Rinse food containers',
            'Crush cans to save space',
            'Remove paper labels when possible',
            'Check if your facility accepts aerosol cans',
            'Scrap metal may need to go to specialized facilities'
        ]
    },
    'organic': {
        'name': 'Organic',
        'tips': [
            'Compost fruit and vegetable scraps',
            'Add to garden compost or municipal collection',
            'Avoid composting meat or dairy products',
            'Consider vermicomposting for indoor composting',
            'Use compostable bags for collection'
        ]
    },
    'e-waste': {
        'name': 'E-Waste',
        'tips': [
            'Never dispose of electronics in regular trash',
            'Check for manufacturer take-back programs',
            'Remove batteries before recycling',
            'Delete personal data from devices',
            'Look for specialized e-waste recycling events'
        ]
    },
    'others': {
        'name': 'Other Waste',
        'tips': [
            'Check local regulations for proper disposal',
            'Consider if items can be donated or reused',
            'Separate hazardous materials for special disposal',
            'Break down large items for easier handling',
            'When in doubt, ask your local waste management facility'
        ]
    }
}

# Simplified waste classification model
class WasteClassifier:
    def __init__(self):
        logging.info("Initializing waste classifier with color-based analysis")
        
    def predict(self, img):
        """
        Simulate waste classification based on image color analysis
        
        This is a demo implementation that uses simple color analysis to classify waste.
        In a real application, you would use a trained machine learning model.
        """
        # Convert to RGB if not already
        img_rgb = img.convert('RGB')
        
        # Resize for faster processing
        img_rgb = img_rgb.resize((50, 50))
        
        # Get color distribution
        pixels = list(img_rgb.getdata())
        r_avg = sum(p[0] for p in pixels) / len(pixels)
        g_avg = sum(p[1] for p in pixels) / len(pixels)
        b_avg = sum(p[2] for p in pixels) / len(pixels)
        
        # Calculate additional features
        brightness = (r_avg + g_avg + b_avg) / 3
        color_variance = ((r_avg - brightness)**2 + (g_avg - brightness)**2 + (b_avg - brightness)**2) / 3
        
        # Simple heuristic based on color
        if g_avg > max(r_avg, b_avg) + 30:
            # Predominantly green - likely organic
            waste_type = 'organic'
            confidence = 0.7 + (min(g_avg, 255) / 510)  # Higher green, higher confidence
        elif brightness > 200:
            # Very light colors - likely paper
            waste_type = 'paper'
            confidence = 0.75
        elif brightness < 60:
            # Very dark - could be e-waste
            waste_type = 'e-waste'
            confidence = 0.65
        elif color_variance < 100 and brightness > 100 and brightness < 180:
            # Gray/silver tones - likely metal
            waste_type = 'metal'
            confidence = 0.7
        elif b_avg > r_avg and b_avg > g_avg:
            # Blue tint - often plastic or glass
            if b_avg - g_avg > 50:
                waste_type = 'glass'
                confidence = 0.68
            else:
                waste_type = 'plastic'
                confidence = 0.72
        else:
            # Use a mix of heuristics for others
            if r_avg > g_avg and r_avg > b_avg:
                waste_type = 'plastic'
                confidence = 0.65
            elif g_avg > r_avg and g_avg < 150:
                waste_type = 'paper'
                confidence = 0.7
            elif brightness > 180:
                waste_type = 'glass'
                confidence = 0.6
            elif color_variance > 150:
                waste_type = 'e-waste'
                confidence = 0.68
            else:
                waste_type = 'others'
                confidence = 0.5
        
        logging.debug(f"Classified as {waste_type} with {confidence:.2f} confidence")
        return waste_type, float(confidence)

# Initialize the classifier
classifier = WasteClassifier()

def classify_waste(img):
    """
    Classify waste from an image
    
    Args:
        img: PIL Image object
        
    Returns:
        tuple: (waste_type, confidence)
    """
    return classifier.predict(img)

def get_recycling_tips(waste_type):
    """
    Get recycling tips for a specific waste type
    
    Args:
        waste_type: String representing waste type
        
    Returns:
        dict: Information about the waste type and recycling tips
    """
    if waste_type in WASTE_TYPES:
        return WASTE_TYPES[waste_type]
    return WASTE_TYPES['others']  # Default fallback
