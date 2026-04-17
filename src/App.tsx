import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import FeedPage from './components/feed/FeedPage'
import CreatorListPage from './components/creators/CreatorListPage'
import LibraryPage from './components/library/LibraryPage'
import ArchivePage from './components/archive/ArchivePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<FeedPage />} />
          <Route path="creators" element={<CreatorListPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="archive" element={<ArchivePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
