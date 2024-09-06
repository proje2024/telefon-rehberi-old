FROM python:3.9-slim

# Çalışma dizinini ayarla
WORKDIR /app

# Sistem paketlerini yükle
RUN apt-get update && apt-get install -y sqlite3

# Gereksinim dosyasını kopyala
COPY requirements.txt .

# Gereksinimleri yükle
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Veritabanı dosyasını oluşturmak için bir Python betiği ekleyin
COPY /api/db/create_db.py /create_db.py

# Veritabanı ve tablo oluşturma işlemini yapın
RUN python /create_db.py

# Yedekleme dizinini oluştur
RUN mkdir -p /app/backups

# Yedekleme scriptini kopyala
COPY /api/db/backup_db.py /app/backup_db.py

# Uygulama dosyalarını kopyala
COPY . .

# Ortam değişkenini kullanarak yedekleme betiğini ve uygulamayı başlat
CMD ["sh", "-c", "python /app/backup_db.py & uvicorn api.main:app --host 0.0.0.0 --port ${BACKEND_HOST}"]
