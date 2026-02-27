import os

class Config:
    """Base configuration"""
    DEBUG = False
    TESTING = False
    FREEZER_RELATIVE_URLS = True
    FREEZER_DESTINATION = os.path.join(os.path.dirname(__file__), 'build')
    FREEZER_IGNORE_MIMETYPE_WARNINGS = True


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False


config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
