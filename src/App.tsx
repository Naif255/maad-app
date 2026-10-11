import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Brand } from './features/brand/Brand'
import { ConsumerLayout } from './features/consumer/ConsumerLayout'
import { History } from './features/consumer/History'
import { Home } from './features/consumer/Home'
import { ImpactCard } from './features/consumer/ImpactCard'
import { Me } from './features/consumer/Me'
import { Receipt } from './features/consumer/Receipt'
import { RequestDetail } from './features/consumer/RequestDetail'
import { Scanner } from './features/consumer/Scanner'
import { Summary } from './features/consumer/Summary'
import { Wallet } from './features/consumer/Wallet'
import { Shell } from './features/demo/Shell'
import { RequireSession, RootRedirect, SignIn, Welcome } from './features/start/Start'
import { CertificateView, Certificates } from './features/factory/Certificates'
import { FactoryBoxes, FactoryLayout, FactorySettings, RoundTab, RoundView } from './features/factory/Factory'
import { ImpactPage } from './features/impact/ImpactLive'
import { Customer } from './features/laundry/Customer'
import { LaundryDashboard } from './features/laundry/Dashboard'
import { LaundryLayout } from './features/laundry/LaundryLayout'
import { NewRequest } from './features/laundry/NewRequest'
import { ScanQr } from './features/laundry/ScanQr'
import { LaundrySettings } from './features/laundry/Settings'
import { LaundryActivity } from './features/laundry/Activity'

export default function App() {
  return (
    <HashRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/signin/:role" element={<SignIn />} />
          <Route path="/start" element={<Navigate to="/welcome" replace />} />
          <Route path="/c" element={<RequireSession role="consumer"><ConsumerLayout /></RequireSession>}>
            <Route index element={<Home />} />
            <Route path="request/:id" element={<RequestDetail />} />
            <Route path="scan" element={<Scanner />} />
            <Route path="summary" element={<Summary />} />
            <Route path="receipt/:groupId" element={<Receipt />} />
            <Route path="reward/:groupId" element={<ImpactCard />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="history" element={<History />} />
            <Route path="me" element={<Me />} />
          </Route>
          <Route path="/l" element={<RequireSession role="laundry"><LaundryLayout /></RequireSession>}>
            <Route index element={<LaundryDashboard />} />
            <Route path="new" element={<NewRequest />} />
            <Route path="scan" element={<ScanQr />} />
            <Route path="customer/:userId" element={<Customer />} />
            <Route path="history" element={<LaundryActivity />} />
            <Route path="settings" element={<LaundrySettings />} />
          </Route>
          <Route path="/f" element={<RequireSession role="factory"><FactoryLayout /></RequireSession>}>
            <Route index element={<FactoryBoxes />} />
            <Route path="round" element={<RoundTab />} />
            <Route path="round/:id" element={<RoundView />} />
            <Route path="certs" element={<Certificates />} />
            <Route path="cert/:id" element={<CertificateView />} />
            <Route path="settings" element={<FactorySettings />} />
          </Route>
          <Route path="/impact" element={<ImpactPage />} />
          <Route path="/brand" element={<Brand />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </Shell>
    </HashRouter>
  )
}
