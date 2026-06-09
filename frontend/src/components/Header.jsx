import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { genreApi } from '../services/genreApi.js';
import { movieApi } from '../services/movieApi.js';
import { normalizeMovies } from '../utils/normalizeMovie.js';
import { slugify } from '../utils/slugify.js';
import UserAvatar from './UserAvatar.jsx';

function Header() {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [genres, setGenres] = useState([]);
  const [countries, setCountries] = useState([]);
  const [openMenu, setOpenMenu] = useState('');
  const headerRef = useRef(null);
  const searchRef = useRef(null);
  const menuCloseTimerRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);
  const trimmedQuery = debouncedQuery.trim();
  const selectedType = new URLSearchParams(search).get('type');

  useEffect(() => {
    Promise.all([genreApi.list(), genreApi.countries()])
      .then(([genreResponse, countryResponse]) => {
        setGenres(genreResponse.data.data || []);
        setCountries(countryResponse.data.data || []);
      })
      .catch(() => {
        setGenres([]);
        setCountries([]);
      });
  }, []);

  useEffect(() => {
    if (!trimmedQuery) {
      setMovies([]);
      setLoading(false);
      setError('');
      return;
    }

    let isCurrent = true;
    setLoading(true);
    setError('');

    movieApi.list({ search: trimmedQuery, limit: 6, sort: 'latest' })
      .then((response) => {
        if (isCurrent) {
          setMovies(normalizeMovies(response.data.data || []));
        }
      })
      .catch((loadError) => {
        if (isCurrent) {
          setMovies([]);
          setError(loadError.response?.data?.message || 'Không tìm được phim.');
        }
      })
      .finally(() => {
        if (isCurrent) {
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [trimmedQuery]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setOpenMenu('');
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useEffect(() => {
    setOpenMenu('');
  }, [pathname, search]);

  useEffect(() => () => window.clearTimeout(menuCloseTimerRef.current), []);

  function openCatalogMenu(name) {
    window.clearTimeout(menuCloseTimerRef.current);
    setOpenMenu(name);
  }

  function scheduleCatalogMenuClose() {
    window.clearTimeout(menuCloseTimerRef.current);
    menuCloseTimerRef.current = window.setTimeout(() => setOpenMenu(''), 160);
  }

  function closeSearch() {
    setIsOpen(false);
    setQuery('');
  }

  return (
    <header className="site-header" ref={headerRef}>
      <div className="header-left">
        <Link className="brand" to="/" aria-label="Netflop">
          <img src="/netflop-logo.svg" alt="Netflop" />
        </Link>
        <nav className="catalog-nav" aria-label="Điều hướng nội dung">
          <NavLink end to="/">Trang chủ</NavLink>
          <NavLink className={selectedType === 'Bộ' ? 'active' : ''} to="/movies?type=Bộ">Phim bộ</NavLink>
          <NavLink className={selectedType === 'Lẻ' ? 'active' : ''} to="/movies?type=Lẻ">Phim lẻ</NavLink>
          <CatalogMenu
            active={pathname.startsWith('/genre/')}
            items={genres.map((genre) => ({
              id: genre.MaTheLoai,
              label: genre.TenTheLoai,
              to: `/genre/${slugify(genre.TenTheLoai)}`
            }))}
            label="Thể loại"
            name="genres"
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            onOpen={openCatalogMenu}
            onClose={scheduleCatalogMenuClose}
          />
          <CatalogMenu
            active={pathname.startsWith('/country/')}
            items={countries.map((country) => ({
              id: country.MaQuocGia,
              label: country.TenQuocGia,
              to: `/country/${slugify(country.TenQuocGia)}`
            }))}
            label="Quốc gia"
            name="countries"
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            onOpen={openCatalogMenu}
            onClose={scheduleCatalogMenuClose}
          />
          <CatalogMenu
            active={pathname.startsWith('/favorites') || pathname.startsWith('/history')}
            items={[
              { id: 'all', label: 'Tất cả phim', to: '/movies' },
              { id: 'favorites', label: 'Phim yêu thích', to: '/account?tab=favorites' },
              { id: 'history', label: 'Lịch sử xem', to: '/account?tab=history' }
            ]}
            label="Khác"
            name="other"
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            onOpen={openCatalogMenu}
            onClose={scheduleCatalogMenuClose}
          />
        </nav>
      </div>
      <div className="header-actions">
        <div className="header-search" ref={searchRef}>
          <input
            className="search-pill"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.currentTarget.blur();
                setIsOpen(false);
              }
            }}
            placeholder="Tìm phim, diễn viên"
            aria-label="Tìm phim, diễn viên"
          />
          {isOpen && query.trim() && (
            <div className="search-popover" role="listbox">
              {loading && <div className="search-state">Đang tìm...</div>}
              {!loading && error && <div className="search-state">{error}</div>}
              {!loading && !error && movies.map((movie) => (
                <Link
                  className="search-result"
                  key={movie.id}
                  to={`/movies/${movie.id}`}
                  onClick={closeSearch}
                  role="option"
                >
                  <span className="search-result-poster">
                    {movie.poster ? <img src={movie.poster} alt={movie.name} /> : movie.name?.charAt(0)}
                  </span>
                  <span className="search-result-info">
                    <strong>{movie.name}</strong>
                    <span>{movie.year || 'Đang cập nhật'} - {movie.rating || 'N/A'}</span>
                  </span>
                </Link>
              ))}
              {!loading && !error && movies.length === 0 && <div className="search-state">Không có phim phù hợp.</div>}
            </div>
          )}
        </div>
        {['admin', 'super_admin'].includes(user?.vai_tro) && <Link className="login-link muted" to="/admin">Admin</Link>}
        {user ? (
          <Link className="header-avatar-link" to="/account" aria-label="Trung tâm tài khoản">
            <UserAvatar src={user.hinh_dai_dien} name={user.ten_dang_nhap} />
            <strong>{user.ten_dang_nhap}</strong>
          </Link>
        ) : (
          <Link className="login-link" to="/login">Đăng nhập</Link>
        )}
      </div>
    </header>
  );
}

function CatalogMenu({ active, items, label, name, openMenu, setOpenMenu, onOpen, onClose }) {
  const isOpen = openMenu === name;

  return (
    <div
      className={`catalog-menu catalog-menu-${name}${active ? ' active' : ''}${isOpen ? ' is-open' : ''}`}
      onMouseEnter={() => onOpen(name)}
      onMouseLeave={onClose}
      onFocus={() => onOpen(name)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onClose();
      }}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setOpenMenu((current) => current === name ? '' : name)}
      >
        {label}<span aria-hidden="true">⌄</span>
      </button>
      {isOpen && (
        <div className="catalog-dropdown">
          {items.length > 0 ? items.map((item) => (
            <Link key={item.id} to={item.to}>
              <span aria-hidden="true">›</span>{item.label}
            </Link>
          )) : <p>Chưa có dữ liệu.</p>}
        </div>
      )}
    </div>
  );
}

export default Header;
