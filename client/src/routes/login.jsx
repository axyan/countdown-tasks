const LogIn = () => {
  return (
    <div className="container">
      <div className="text-center mt-5 mb-4">
        <h1>Log in</h1>
      </div>

      <div className="row justify-content-center">
        <form method="POST" action="" className="row col-6">
          <div className="mb-3">
            <label for="email" className="form-label">Email</label>
            <input type="email" className="form-control" id="email" name="email" required />
          </div>
          <div className="mb-3">
            <label for="password" className="form-label">Password</label>
            <input type="password" className="form-control" id="password" name="password" required />
          </div>
          <button type="submit" className="btn btn-primary mt-3">Log in</button>
        </form>
      </div>
    </div>
  );
};

export default LogIn;
