-- Tabel jurnal untuk fitur Bandingkan Jurnal.
create table if not exists public.journals (
  id          text primary key,
  name        text not null,
  issn        text,
  e_issn      text,
  index       text not null,
  publisher   text,
  scope       text,
  frequency   text,
  access_type text,
  language    text,
  country     text,
  website     text,
  topics      text[] default '{}',
  description text,
  created_at  timestamptz default now()
);

alter table public.journals enable row level security;

-- Jurnal bersifat data publik: siapa pun boleh membaca.
drop policy if exists "journals_read_all" on public.journals;
create policy "journals_read_all" on public.journals for select using (true);

-- Data dummy
insert into public.journals (id, name, issn, e_issn, index, publisher, scope, frequency, access_type, language, country, website, topics, description) values
('j1','Journal of Information System and Technology (JOINT)','2548-4834','2548-9534','Sinta 4','Universitas Internasional Batam','Sistem Informasi & Teknologi','2× per tahun','Open Access','Indonesia / Inggris','Indonesia','https://journal.uib.ac.id/index.php/joint','{"Sistem Informasi","Machine Learning","Big Data","IoT","E-Commerce","ERP"}','Jurnal ilmiah di bidang sistem informasi, rekayasa perangkat lunak, dan teknologi informasi terapan.'),
('j2','Jurnal Teknologi Informasi','1907-2430','2685-4015','Sinta 3','LPPM Universitas Dian Nuswantoro','Teknologi Informasi & Komputer','3× per tahun','Open Access','Indonesia','Indonesia','https://publikasi.dinus.ac.id/index.php/jt','{"AI","Machine Learning","Jaringan Komputer","Keamanan Siber","UMKM Digital","Transformasi Digital"}','Penelitian orisinal tentang pengembangan, penerapan, dan evaluasi teknologi informasi.'),
('j3','Jurnal Interaksi Manusia dan Komputer','2655-5891','2655-990X','Sinta 4','APTIKOM','Human-Computer Interaction & UX','2× per tahun','Open Access','Indonesia','Indonesia','https://jurnal.aptikom.or.id/imk','{"UX","UI Design","Usability","E-Commerce","Mobile App","Aksesibilitas"}','Penelitian interaksi manusia dan sistem komputer, termasuk desain antarmuka dan pengalaman pengguna.'),
('j4','Jurnal Sistem Informasi','1979-0767','2461-0690','Sinta 5','Universitas Islam Negeri Syarif Hidayatullah','Sistem Informasi Manajemen','2× per tahun','Open Access','Indonesia','Indonesia','https://journal.uinjkt.ac.id/index.php/jsi','{"Sistem Informasi Akademik","ERP","SAP","Web","Basis Data","Keamanan Informasi"}','Penelitian pengembangan dan implementasi sistem informasi di lingkungan organisasi.'),
('j5','Jurnal Ilmu Komputer','1979-116X','2614-8897','Sinta 4','Universitas Udayana','Ilmu Komputer & Informatika','2× per tahun','Open Access','Indonesia / Inggris','Indonesia','https://ojs.unud.ac.id/index.php/jik','{"Algoritma","Naive Bayes","NLP","Pengenalan Pola","Data Mining","Klasifikasi"}','Algoritma, kecerdasan buatan, pengenalan pola, dan pengolahan bahasa alami.'),
('j6','Jurnal Manajemen Bisnis','1979-1844','2615-7527','Sinta 5','Universitas Muhammadiyah Malang','Manajemen & Bisnis','2× per tahun','Open Access','Indonesia','Indonesia','https://ejournal.umm.ac.id/index.php/jmb','{"Digital Marketing","UMKM","Pemasaran","Strategi Bisnis","Kewirausahaan","Batam"}','Penelitian manajemen bisnis, pemasaran, dan kewirausahaan.'),
('j7','Jurnal Akuntansi dan Keuangan','1411-0288','2338-8137','Sinta 3','Universitas Kristen Petra','Akuntansi & Keuangan','4× per tahun','Open Access','Indonesia / Inggris','Indonesia','https://jurnalakuntansi.petra.ac.id','{"Akuntansi","SAK EMKM","Laporan Keuangan","Audit","Perpajakan","IFRS"}','Penelitian empiris akuntansi keuangan, manajemen, perpajakan, dan auditing.'),
('j8','Jurnal Hukum dan Pembangunan','0125-9687','2503-1465','Sinta 2','Universitas Indonesia','Hukum & Pembangunan','4× per tahun','Open Access','Indonesia / Inggris','Indonesia','https://jhp.ui.ac.id','{"Hukum Perdata","Perlindungan Konsumen","E-Commerce","Hukum Bisnis","Kebijakan Publik","Cyberlaw"}','Penelitian hukum normatif maupun empiris, lingkup nasional dan internasional.')
on conflict (id) do nothing;
