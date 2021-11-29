const Protected = () => {
  fetch('http://localhost:3000/protected')
    .then(response => {
      return response.json();
    })
    .then(response => {
      console.log(response);
    });

  return (
    <div>
      <h1>HELLO WORLD</h1>
    </div>
  );
};

export default Protected;
