

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800">
      <div className="container mx-auto px-6 py-8">
        {/* Copyright */}
        <div className="text-center">
          <p className="text-gray-400">
            © {currentYear} Kilax Movies. All rights reserved. | Your ultimate streaming destination.
          </p>
        </div>
      </div>
    </footer>
  );
}
