# Python uygulamanızın Dockerfile'ı
FROM python:3.9-slim

# Çalışma dizinini oluştur
WORKDIR /app

# Gerekli dosyaları kopyala
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Wait script'i kopyala ve çalıştırma izinleri ver
COPY wait.sh /wait.sh
RUN chmod +x /wait.sh

# Uygulamanızı başlatmadan önce wait.sh'i kullan
ENTRYPOINT ["/wait.sh"]
CMD ["python", "app.py"]
