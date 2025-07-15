import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Directory from "./Directory";

const router = createBrowserRouter([
  {
    path: "/*",
    element: <Directory />
  },
]);

function App() {
  return <RouterProvider router={router} />
}

export default App;