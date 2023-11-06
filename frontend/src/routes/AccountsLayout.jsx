import { Outlet } from 'react-router-dom';

export default function AccountsLayout() {
  return (
    <div className="container d-flex justify-content-center my-5">
      <div className="col-12 col-lg-8 col-xl-6">
        <Outlet />
      </div>
    </div>
  );
}
