from flask import Flask, render_template, send_from_directory

app = Flask(__name__, template_folder='.')  # Template folder set to root

@app.route('/')
def index():
    return render_template('index.html')  # Render the main HTML file

# Route to serve the CSS file from the root directory
@app.route('/index.css')
def serve_css():
    return send_from_directory('.', 'index.css')

# Route to serve the JavaScript file from the root directory
@app.route('/script.js')
def serve_js():
    return send_from_directory('.', 'script.js')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
