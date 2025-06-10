import FormContent from "@/components/FormContent";
import Header from "@/components/Header";

export default function () {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="py-8">
        <FormContent />
      </main>
    </div>
  )
}