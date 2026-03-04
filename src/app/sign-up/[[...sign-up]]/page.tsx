import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-mke-cream flex items-center justify-center">
      <div className="bg-white border-2 border-mke-dark shadow-[6px_6px_0px_0px_#1A1A2E] rounded-lg p-8">
        <h1 className="text-2xl font-bold text-mke-blue font-head mb-6 text-center">
          MKE Budget Compass
        </h1>
        <SignUp />
      </div>
    </div>
  );
}
