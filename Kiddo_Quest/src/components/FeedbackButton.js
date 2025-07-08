import React from 'react';

export default function FeedbackButton({ onClick }) {
  return (
    <button
      className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg px-5 py-3 font-semibold flex items-center gap-2"
      style={{ boxShadow: '0 4px 20px rgba(80,80,200,0.15)' }}
      onClick={onClick}
      aria-label="Send Feedback or Report Bug"
    >
      <span role="img" aria-label="bug">🐞</span> Feedback
    </button>
  );
}
