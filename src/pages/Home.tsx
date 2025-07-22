import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-4">Welcome to the Home Page</h1>
      <p className="text-lg bg-warning-foreground text-warning">
        This is a simple home page built with React and Tailwind CSS.
      </p>
      <p onClick={() => navigate("/demo")}>click me 2 demo</p>
    </div>
  );
}

export default Home;
