import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Analytics from './pages/Analytics'
import Segmentation from './pages/Segmentation'
import ChurnAnalysis from './pages/ChurnAnalysis'
import Marketing from './pages/Marketing'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/segments" element={<Segmentation />} />
        <Route path="/churn" element={<ChurnAnalysis />} />
        <Route path="/marketing" element={<Marketing />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
