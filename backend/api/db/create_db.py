import sqlite3
from dotenv import load_dotenv
import os

# .env dosyasını yükle
load_dotenv()

def create_tables():
    # .env dosyasından DATABASE_NAME değişkenini al
    db_name = os.getenv('DATABASE_NAME', 'rehber_db.db')  # varsayılan olarak 'rehber_db.db' kullanılır

    # Veritabanı bağlantısını oluşturun
    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()
    
    # Roller tablosu oluştur
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT
        )
    ''')
    cursor.execute('''
        INSERT OR IGNORE INTO Roles (name, description) VALUES
        ('admin', 'Admin has the capability to do everything'),
        ('users', 'Default users can view directory')
    ''')

    # Abonelik türleri tablosu oluştur
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS subscriptionTypes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subscription_types TEXT
        )
    ''')
   
    # Hiyerarşi tablosu oluştur
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS hiyerarcy (
            id TEXT PRIMARY KEY,
            adi TEXT,
            hiyerAd TEXT,
            internal_number TEXT,
            ip_number TEXT,
            mailbox TEXT,
            visibility INTEGER DEFAULT 1,
            spare_number TEXT,
            subscription_id INTEGER DEFAULT 1,
            FOREIGN KEY (subscription_id) REFERENCES subscriptionTypes(id)
        )
    ''')
    
    # Kullanıcılar tablosu oluştur
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            surname TEXT NOT NULL,
            phone_number TEXT,
            username TEXT UNIQUE,
            password TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role INTEGER DEFAULT 2,
            FOREIGN KEY (role) REFERENCES Roles(id)
        )
    ''')

    # Dizin tablosu oluştur
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS directory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hiyerid TEXT,
            ataid INTEGER,
            FOREIGN KEY (hiyerid) REFERENCES hiyerarcy(id),
            FOREIGN KEY (ataid) REFERENCES directory(id)
        )
    ''')

    conn.commit()
    conn.close()

if __name__ == "__main__":
    create_tables()
    print("Database and tables created successfully.")
