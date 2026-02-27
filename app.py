import os
import json
from flask import Flask, render_template, jsonify
from flask_frozen import Freezer
from config import config_by_name


def create_app(config_name='default'):
    """Application factory function"""
    app = Flask(__name__,
                template_folder='templates',
                static_folder='static',
                static_url_path='/static')

    config_class = config_by_name[config_name]
    app.config.from_object(config_class)

    # Register routes
    register_routes(app)

    return app


def register_routes(app):
    """Register application routes"""

    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/about')
    def about():
        return render_template('about.html')

    @app.route('/contact')
    def contact():
        return render_template('contact.html')

    @app.route('/attribution')
    def attribution():
        return render_template('attribution.html')

    @app.route('/billing-models')
    def billing_models():
        return render_template('billing-models.html')

    @app.route('/config.json')
    def config():
        """Serve config.json from root directory"""
        config_path = os.path.join(os.path.dirname(__file__), 'config.json')
        with open(config_path, 'r') as f:
            return jsonify(json.load(f))


def create_freezer(app):
    """Create and configure Freezer instance"""
    freezer = Freezer(app)

    @freezer.register_generator
    def page_generator():
        yield '/'
        yield '/about'
        yield '/contact'
        yield '/attribution'
        yield '/billing-models'

    return freezer


if __name__ == '__main__':
    app = create_app(os.getenv('FLASK_ENV', 'development'))

    if os.getenv('FREEZE') == '1':
        freezer = create_freezer(app)
        freezer.freeze()
    else:
        host = os.getenv('FLASK_HOST', '0.0.0.0')
        port = int(os.getenv('FLASK_PORT', 8080))
        app.run(debug=app.config['DEBUG'], host=host, port=port)
