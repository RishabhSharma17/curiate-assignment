import Header from "@/components/Header";
import InputContent from "@/components/InputContent";
import { ToggleTheme } from "@/components/ToggleTheme";

export default function () {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="py-8">
        <InputContent />
      </main>
    </div>
  )
}