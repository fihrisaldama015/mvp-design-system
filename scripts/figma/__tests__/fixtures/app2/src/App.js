import { Route, Routes } from "react-router-dom"
import Layout from "app/Layout"
import Landing from "pages/Landing"
import Shop from "pages/Shop"
import ShopItem from "pages/ShopItem"

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="/shop">
          <Route index element={<Shop />} />
          <Route path="item" element={<ShopItem />} />
        </Route>
      </Route>
    </Routes>
  )
}
