# Database

Database name: `web_xem_phim`.

Place the complete schema in `database/web_xem_phim_complete.sql` and seed data
in `database/seed.sql`.

## Countries

Backend Netflop uses Vietnamese table and column names for countries:

```sql
quocgia(MaQuocGia, TenQuocGia, MaCode, NgayTao)
```

If your imported SQL currently has:

```sql
countries(id, name, code, created_at)
```

run:

```sql
SOURCE database/chuyen_countries_sang_tieng_viet.sql;
```

or import `database/chuyen_countries_sang_tieng_viet.sql` in phpMyAdmin.
