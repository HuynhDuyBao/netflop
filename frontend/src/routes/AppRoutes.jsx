import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import Home from '../pages/Home.jsx';
import MovieList from '../pages/MovieList.jsx';
import MovieDetail from '../pages/MovieDetail.jsx';
import WatchMovie from '../pages/WatchMovie.jsx';
import Search from '../pages/Search.jsx';
import Genre from '../pages/Genre.jsx';
import Country from '../pages/Country.jsx';
import CognitoRedirect from '../pages/CognitoRedirect.jsx';
import AuthCallback from '../pages/AuthCallback.jsx';
import AccountCenter from '../pages/AccountCenter.jsx';
import PersonDetail from '../pages/PersonDetail.jsx';
import Dashboard from '../admin/pages/Dashboard.jsx';
import AdminMovieList from '../admin/pages/MovieList.jsx';
import MovieCreate from '../admin/pages/MovieCreate.jsx';
import MovieEdit from '../admin/pages/MovieEdit.jsx';
import TmdbImport from '../admin/pages/TmdbImport.jsx';
import EpisodeList from '../admin/pages/EpisodeList.jsx';
import EpisodeCreate from '../admin/pages/EpisodeCreate.jsx';
import GenreList from '../admin/pages/GenreList.jsx';
import PersonList from '../admin/pages/PersonList.jsx';
import UserList from '../admin/pages/UserList.jsx';
import CommentList from '../admin/pages/CommentList.jsx';
import RatingList from '../admin/pages/RatingList.jsx';
import BannerList from '../admin/pages/BannerList.jsx';
import Setting from '../admin/pages/Setting.jsx';
import AdminRoute from './AdminRoute.jsx';
import PrivateRoute from './PrivateRoute.jsx';

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="movies" element={<MovieList />} />
        <Route path="movies/:id" element={<MovieDetail />} />
        <Route path="watch/:id" element={<WatchMovie />} />
        <Route path="search" element={<Search />} />
        <Route path="genre/:slug" element={<Genre />} />
        <Route path="country/:slug" element={<Country />} />
        <Route path="login" element={<CognitoRedirect screen="login" />} />
        <Route path="register" element={<CognitoRedirect screen="signup" />} />
        <Route path="auth/callback" element={<AuthCallback />} />
        <Route path="favorites" element={<Navigate to="/account?tab=favorites" replace />} />
        <Route path="history" element={<Navigate to="/account?tab=history" replace />} />
        <Route path="account" element={<PrivateRoute><AccountCenter /></PrivateRoute>} />
        <Route path="people/:id" element={<PersonDetail />} />
      </Route>
      <Route path="admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="movies" element={<AdminMovieList />} />
        <Route path="movies/create" element={<MovieCreate />} />
        <Route path="movies/:id/edit" element={<MovieEdit />} />
        <Route path="tmdb-import" element={<TmdbImport />} />
        <Route path="episodes" element={<EpisodeList />} />
        <Route path="episodes/create" element={<EpisodeCreate />} />
        <Route path="genres" element={<GenreList />} />
        <Route path="people" element={<PersonList />} />
        <Route path="users" element={<UserList />} />
        <Route path="comments" element={<CommentList />} />
        <Route path="ratings" element={<RatingList />} />
        <Route path="banners" element={<BannerList />} />
        <Route path="settings" element={<Setting />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
