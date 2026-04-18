from flask import Flask, render_template, request, send_file, jsonify, send_from_directory
import os
from PIL import Image, ImageDraw
import uuid
import requests
from io import BytesIO
app = Flask(__name__, static_folder='.', static_url_path='')
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)
@app.route('/')
def index():
    return render_template('index.html')
@app.route('/upload', methods=['POST'])
def upload():
    if 'photo' in request.files:
        file = request.files['photo']
        if file.filename == '':
            return jsonify({'error': 'No file'}), 400
        photo_id = str(uuid.uuid4())
        filename = f"{photo_id}.png"
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
    elif request.is_json:
        data = request.get_json()
        url = data.get('url')
        if not url:
            return jsonify({'error': 'No URL'}), 400
        try:
            response = requests.get(url, timeout=10)
            img = Image.open(BytesIO(response.content))
            photo_id = str(uuid.uuid4())
            filename = f"{photo_id}.png"
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            img.save(file_path, 'PNG')
        except Exception as e:
            return jsonify({'error': str(e)}), 400
    else:
        return jsonify({'error': 'No image provided'}), 400
    
    try:
        img = Image.open(file_path)
        if max(img.size) > 1200:
            img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
            img.save(file_path, optimize=True, quality=90)
    except:
        pass
    return jsonify({'filename': filename})
@app.route('/remove_bg/<filename>')
def remove_bg(filename):
    input_path = os.path.join(UPLOAD_FOLDER, filename)
    output_path = os.path.join(PROCESSED_FOLDER, f"nobg_{filename}")
    if os.path.exists(output_path):
        return send_file(output_path, mimetype='image/png')
    try:
        with open(input_path, 'rb') as f:
            input_data = f.read()
        from rembg import remove
        output_data = remove(input_data)
        with open(output_path, 'wb') as f:
            f.write(output_data)
        return send_file(output_path, mimetype='image/png')
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/add_background/<filename>', methods=['POST'])
def add_background(filename):
    data = request.get_json()
    bg_type = data.get('type', 'solid')
    bg_data = data.get('data', {})
    input_path = os.path.join(PROCESSED_FOLDER, f"nobg_{filename}")
    if not os.path.exists(input_path):
        return jsonify({'error': 'Processed image not found'}), 404
    try:
        img = Image.open(input_path)
        output_path = os.path.join(PROCESSED_FOLDER, f"bg_{filename}")
        if bg_type == 'solid':
            color = bg_data.get('color', '#FFFFFF')
            color = color.lstrip('#')
            bg_rgb = tuple(int(color[i:i+2], 16) for i in (0, 2, 4))
            background = Image.new('RGBA', img.size, bg_rgb + (255,))
            if img.mode == 'RGBA':
                result = Image.alpha_composite(background, img)
            else:
                result = img
            result = result.convert('RGB')
            result.save(output_path, 'PNG', optimize=True, quality=95)
        elif bg_type == 'gradient':
            colors = bg_data.get('colors', ['#667eea', '#764ba2'])
            background = Image.new('RGBA', img.size, (255,255,255,255))
            draw = ImageDraw.Draw(background)
            width, height = img.size
            for i in range(height):
                ratio = i / height if height > 0 else 0
                r = int(int(colors[0][1:3], 16) * (1-ratio) + int(colors[-1][1:3], 16) * ratio)
                g = int(int(colors[0][3:5], 16) * (1-ratio) + int(colors[-1][3:5], 16) * ratio)
                b = int(int(colors[0][5:7], 16) * (1-ratio) + int(colors[-1][5:7], 16) * ratio)
                draw.line([(0, i), (width, i)], fill=(r, g, b, 255))
            if img.mode == 'RGBA':
                result = Image.alpha_composite(background, img)
            else:
                result = img
            result = result.convert('RGB')
            result.save(output_path, 'PNG', optimize=True, quality=95)
        return send_file(output_path, mimetype='image/png')
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500
@app.route('/enhance/<filename>', methods=['POST'])
def enhance(filename):
    data = request.get_json()
    settings = data.get('settings', {})
    input_path = os.path.join(UPLOAD_FOLDER, filename)
    output_path = os.path.join(PROCESSED_FOLDER, f"enhanced_{filename}")
    try:
        img = Image.open(input_path)
        from PIL import ImageEnhance
        if 'contrast' in settings:
            img = ImageEnhance.Contrast(img).enhance(settings['contrast'])
        if 'sharpness' in settings:
            img = ImageEnhance.Sharpness(img).enhance(settings['sharpness'])
        if 'brightness' in settings:
            img = ImageEnhance.Brightness(img).enhance(settings['brightness'])
        img.save(output_path, optimize=True, quality=95)
        return send_file(output_path, mimetype='image/png')
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/download/<filename>')
def download(filename):
    file_path = os.path.join(PROCESSED_FOLDER, filename)
    if not os.path.exists(file_path):
        return 'File not found', 404
    return send_file(file_path, as_attachment=True, download_name='removed_bg.png')
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)