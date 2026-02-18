import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 w-full max-w-md">
        <RegisterForm />
        <div className="mt-6 text-center">
          <span className="text-zinc-600 dark:text-zinc-300">Already have an account?</span>
          <a
            href="/signin"
            className="ml-2 text-blue-600 hover:underline font-semibold"
          >
            Login
          </a>
        </div>
      </div>
    </div>
  );
}
