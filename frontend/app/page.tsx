import { LuSparkles, LuBookOpen, LuGraduationCap } from "react-icons/lu";
import Logo from "../components/Logo";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-rs-900 flex flex-col text-white relative overflow-hidden">
      {/* Fondo animado de ondas */}
      <div className="absolute inset-0 z-0">
        <svg
          className="absolute bottom-0 w-full h-auto opacity-20"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="#3A8A65"
            fillOpacity="1"
            d="M0,192L48,186.7C96,181,192,171,288,181.3C384,192,480,224,576,240C672,256,768,256,864,245.3C960,235,1056,213,1152,186.7C1248,160,1344,128,1392,112L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          ></path>
        </svg>
      </div>
      {/* Patrón de puntos en la esquina superior derecha */}
      <div
        className="absolute top-0 right-0 w-[100%] h-[65%] opacity-10 z-0 pointer-events-none overflow-hidden"
        style={{
          backgroundImage: `
            radial-gradient(circle, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          clipPath: "circle(75% at 100% 0%)", // crea el efecto semicircular
        }}
      ></div>

      {/* HERO SECTION */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center mt-16 px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Personalized learning by <span className="text-rs-lime">RootSearch</span>
        </h1>
        <p className="text-rs-150 max-w-2xl mb-8">
          To help students and teachers with personalized and intelligent tools 
          designed to make education more effective and enjoyable.
        </p>

        <div className="flex gap-4">
          <a
            href="/auth/login"
            className="bg-rs-700 hover:bg-rs-600 px-6 py-3 rounded-full font-semibold transition"
          >
            Get Started
          </a>
          <a
            href="#"
            className="border border-white hover:bg-white hover:text-rs-900 px-6 py-3 rounded-full font-semibold transition"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-1 py-20 px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-6xl mt-12">
          {/* For Students */}
          <div className="relative w-full md:w-1/2">
            <div className="backdrop-blur-md bg-white/10 border border-white/10 rounded-3xl p-8 text-center shadow-lg flex flex-col justify-center min-h-[320px] relative">
              <img
                src="/assets/gato_estudiante.png"
                alt="Student Cat"
                className="absolute -top-10 left-1/2 -translate-x-1/2 w-28 h-28 object-contain"
              />
              <h2 className="text-2xl font-bold mb-3 mt-10 text-[#ffffff]">
                For Students
              </h2>
              <p className="text-rs-150 text-sm md:text-base">
                We understand how challenging it can be to grasp new topics. Our
                tools help you learn smarter, not harder — adapting materials to
                your needs, pace, and learning style.
              </p>
            </div>
          </div>

          {/* Logo */}
          <div className="flex flex-col items-center justify-center">
            <Logo size={208} variant="principal" />
          </div>

          {/* For Teachers */}
          <div className="relative w-full md:w-1/2">
            <div className="backdrop-blur-md bg-white/10 border border-white/10 rounded-3xl p-8 text-center shadow-lg flex flex-col justify-center min-h-[320px] relative">
              <img
                src="/assets/gato_profesor.png"
                alt="Teacher Cat"
                className="absolute -bottom-10 right-6 w-28 h-28 object-contain"
              />
              <h2 className="text-2xl font-bold mb-3 text-[#ffffff] mt-4">
                For Teachers
              </h2>
              <p className="text-rs-150 text-sm md:text-base">
                Simplify complex topics and connect with your students better.
                Our platform helps you generate adaptive content and track
                learning progress effectively.
              </p>
            </div>
          </div>
        </div>

        {/* FEATURES SECTION */}
        <section className="relative z-10 w-full max-w-6xl mt-20 px-6">
          <h2 className="text-3xl font-bold text-center mb-10 text-white">
            Why Choose <span className="text-rs-lime">RootSearch</span>?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="flex flex-col items-center bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-md text-center hover:scale-105 hover:shadow-lg transition">
              <div className="w-14 h-14 rounded-full bg-rs-700 text-rs-lime flex items-center justify-center mb-4">
                <LuSparkles className="size-7" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">
                AI-Powered Learning
              </h3>
              <p className="text-rs-150 text-sm">
                Intelligent tools that adapt study materials to every student’s pace,
                interests, and knowledge gaps.
              </p>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col items-center bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-md text-center hover:scale-105 hover:shadow-lg transition">
              <div className="w-14 h-14 rounded-full bg-rs-600 text-white flex items-center justify-center mb-4">
                <LuBookOpen className="size-7" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">
                Adaptive Content
              </h3>
              <p className="text-rs-150 text-sm">
                Generate personalized exercises, quizzes, and summaries designed to
                improve engagement and retention.
              </p>
            </div>

            {/* Card 3 */}
            <div className="flex flex-col items-center bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-md text-center hover:scale-105 hover:shadow-lg transition">
              <div className="w-14 h-14 rounded-full bg-rs-lime text-rs-900 flex items-center justify-center mb-4">
                <LuGraduationCap className="size-7" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">
                Teacher Assistance
              </h3>
              <p className="text-rs-150 text-sm">
                Empower teachers with insights and tools to easily create, evaluate,
                and adapt learning materials.
              </p>
            </div>
          </div>
        </section>

      </main>


    </div>
  );
}
