⏱️ Çalışan Takip Sistemi (Employee Time Tracker) - MVP

Modern işletmeler ve uzaktan çalışan ekipler için geliştirilmiş, sade ve kullanıcı dostu bir Çalışan Zaman ve Mesai Takip arayüzü prototipi.

Bu proje, herhangi bir harici framework veya kütüphane kullanılmadan, tamamen saf (Vanilla) HTML5, CSS3 ve JavaScript kullanılarak uygulamanın temel iş mantığını (MVP - Minimum Viable Product) simüle etmek amacıyla geliştirilmiştir.

🎯 Projenin Amacı

Karmaşık kurumsal yazılımlara geçiş yapmadan önce, temel mesai takibi (giriş-çıkış saatleri, mola yönetimi ve çalışma süresi hesaplama) akışlarının tarayıcı tabanlı olarak nasıl kurgulanabileceğini göstermek ve geliştirme sürecinin ilk adımını (v1.0) oluşturmaktır.

✨ Mevcut Özellikler (v1.0 - Frontend Prototipi)

Canlı Mesai Sayacı (Time Tracker): Çalışanların tek tıkla mesaiye başlama, mola verme ve mesaiyi bitirme işlemlerini gerçekleştirebildiği dinamik kronometre.

Çalışan Listesi ve Durum Göstergesi: Personellerin anlık durumlarını (Aktif, Molada, Çevrimdışı) gösteren temel yönetim paneli.

Günlük Zaman Çizelgesi (Timesheet): Tamamlanan mesai sürelerinin tarayıcı oturumu (veya LocalStorage) üzerinde listelenmesi.

Duyarlı Tasarım (Responsive UI): Masaüstü ve mobil cihazlarla uyumlu, sade ve göz yormayan arayüz.

🛠️ Kullanılan Teknolojiler

HTML5: Semantik sayfa yapısı ve form elemanları.

CSS3: Flexbox/Grid tabanlı modern yerleşim düzeni ve özel stil tanımlamaları.

JavaScript (ES6+): DOM manipülasyonu, zamanlayıcı (timer) mantığı ve veri yönetimi.

🚀 Kurulum ve Çalıştırma

Bu proje saf frontend teknolojileri ile yazıldığı için herhangi bir derleme (build) veya sunucu kurulumu gerektirmez.

Repoyu bilgisayarınıza klonlayın:

git clone https://github.com/kullanici-adin/proje-adin.git


Proje klasörüne gidin:

cd proje-adin


index.html dosyasını herhangi bir modern web tarayıcısında (Chrome, Firefox, Edge vb.) çift tıklayarak açın. (Geliştirme ortamı için VS Code Live Server eklentisi önerilir.)

🗺️ Gelecek Planları (Roadmap - SaaS Dönüşümü)

Proje şu an temel bir frontend prototipi aşamasındadır. İlerleyen sürümlerde tam teşekküllü bir SaaS ürününe dönüştürülmesi için planlanan geliştirmeler:

[ ] Backend Entegrasyonu: Node.js / Express veya Python (Django/FastAPI) ile RESTful API geliştirilmesi.

[ ] Veritabanı Bağlantısı: Kullanıcı ve mesai kayıtlarının kalıcı olarak tutulması (PostgreSQL / MongoDB).

[ ] Kimlik Doğrulama (Auth): JWT tabanlı giriş/kayıt sistemi ve Rol Tabanlı Yetkilendirme (Admin / Çalışan ayrımı).

[ ] İzin ve Vardiya Yönetimi: Yıllık izin talepleri ve haftalık vardiya planlama modülü.

[ ] Raporlama: Aylık puantaj verilerinin Excel ve PDF formatında dışa aktarılması.

🤝 Katkıda Bulunma

Bu proje açık kaynaklı bir öğrenme ve geliştirme projesidir. Fikirlerinize, hata bildirimlerinize (Issue) ve geliştirmelerinize (Pull Request) her zaman açıktır!
