import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import Home from '@/pages/Home';
import IdeaDetail from '@/pages/IdeaDetail';
import PostIdea from '@/pages/PostIdea';
import Bounty from '@/pages/Bounty';
import PostBounty from '@/pages/PostBounty';
import Chat from '@/pages/Chat';
import ChatRoom from '@/pages/ChatRoom';
import UserPage from '@/pages/UserPage';
import Profile from '@/pages/Profile';
import MyIdeas from '@/pages/MyIdeas';
import Favorites from '@/pages/Favorites';
import Transactions from '@/pages/Transactions';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/idea/:id" element={<IdeaDetail />} />
          <Route path="/post" element={<PostIdea />} />
          <Route path="/bounty" element={<Bounty />} />
          <Route path="/bounty/post" element={<PostBounty />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:id" element={<ChatRoom />} />
          <Route path="/user/:id" element={<UserPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my/ideas" element={<MyIdeas />} />
          <Route path="/my/favorites" element={<Favorites />} />
          <Route path="/my/transactions" element={<Transactions />} />
        </Route>
      </Routes>
    </Router>
  );
}