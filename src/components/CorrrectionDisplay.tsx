import React, { useState } from 'react';
import axios from 'axios';
import { FiCheck } from 'react-icons/fi';

type Replacement = {
  value: string;
};

type Match = {
  message: string;
  shortMessage: string;
  replacements: Replacement[];
  offset: number;
  length: number;
  context: {
    text: string;
  };
};

type LanguageData = {
  name: string;
  code: string;
};

type Corrections = {
  matches: Match[];
  language: LanguageData;
};

type ReadabilityResponse = {
  success: boolean;
  message?: string;
  corrections?: Corrections;
  error?: string;
};

const GrammarChecker: React.FC = () => {
  const [content, setContent] = useState('');
  const [results, setResults] = useState<ReadabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [fixedMatches, setFixedMatches] = useState<Record<string, boolean>>({});

  const calculateWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setFixedMatches({});
    try {
      const response = await axios.post<ReadabilityResponse>('/api/analyze', {
        content,
        language
      });
      setResults(response.data);
    } catch (error) {
      setResults({
        success: false,
        error: 'Failed to analyze content'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFix = (match: Match, replacement: string) => {
    if (!results?.corrections) return;
    
    const newContent = 
      content.substring(0, match.offset) + 
      replacement + 
      content.substring(match.offset + match.length);
    
    setContent(newContent);
    
    // Mark this match as fixed
    const matchKey = `${match.offset}-${match.length}-${match.message.substring(0, 20)}`;
    setFixedMatches(prev => ({ ...prev, [matchKey]: true }));
  };

  // Separate matches into corrections (with one replacement) and suggestions (others)
  const separateMatches = (matches: Match[]) => {
    const corrections: Match[] = [];
    const suggestions: Match[] = [];

    matches.forEach(match => {
      // Create unique key for this match
      const matchKey = `${match.offset}-${match.length}-${match.message.substring(0, 20)}`;
      
      if (match.replacements.length === 1 && !fixedMatches[matchKey]) {
        corrections.push(match);
      } else {
        suggestions.push(match);
      }
    });

    return { corrections, suggestions };
  };

  // Group matches by sentence
  const groupMatchesBySentence = (matches: Match[]) => {
    const sentenceMap: Record<string, Match[]> = {};
    
    matches.forEach(match => {
      const sentence = match.context.text;
      if (!sentenceMap[sentence]) {
        sentenceMap[sentence] = [];
      }
      sentenceMap[sentence].push(match);
    });
    
    return sentenceMap;
  };

  // Get corrections and suggestions
  const { corrections, suggestions } = results?.corrections?.matches 
    ? separateMatches(results.corrections.matches) 
    : { corrections: [], suggestions: [] };
    
  // Group by sentence
  const correctionGroups = groupMatchesBySentence(corrections);
  const suggestionGroups = groupMatchesBySentence(suggestions);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Grammar & Readability Checker</h1>
      
      <div className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full p-2 border rounded"
          placeholder="Enter text to analyze..."
        />
      </div>
      
      <div className="flex gap-4 mb-4">
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="en">English</option>
          <option value="de">German</option>
          <option value="fr">French</option>
          <option value="es">Spanish</option>
          <option value="it">Italian</option>
        </select>
        
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {loading ? 'Analyzing...' : 'Check Grammar'}
        </button>
      </div>

      {results && (
        <div className="mt-6">
          {!results.success ? (
            <div className="text-red-500 p-4 bg-red-50 rounded">
              Error: {results.error || 'Unknown error'}
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-6 p-4  rounded">
                <div className="text-center">
                  <h3 className="font-semibold">Word Count</h3>
                  <p className="text-2xl">{calculateWordCount(content)}</p>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold">Language</h3>
                  <p className="text-xl">
                    {results.corrections?.language?.name || 'Unknown'}
                  </p>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold">Issues Found</h3>
                  <p className="text-2xl">
                    {results.corrections?.matches?.length || 0}
                  </p>
                </div>
              </div>

              {(corrections.length > 0 || suggestions.length > 0) ? (
                <div className="border rounded-lg overflow-hidden">
                  {corrections.length > 0 && (
                    <>
                      <h2 className=" p-3 font-bold text-blue-800">Corrections</h2>
                      
                      {Object.entries(correctionGroups).map(
                        ([sentence, matches], idx) => (
                          <div key={`corr-${idx}`} className="p-4 border-b">
                            <p className="mb-3 text-gray-700">{sentence}</p>
                            
                            <div className="space-y-3">
                              {matches.map((match, matchIdx) => {
                                const matchKey = `${match.offset}-${match.length}-${match.message.substring(0, 20)}`;
                                const isFixed = fixedMatches[matchKey];
                                
                                return (
                                  <div key={`corr-match-${matchIdx}`} className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="font-medium text-red-600">
                                        {match.message}
                                      </p>
                                      {match.replacements.length > 0 && (
                                        <p className="text-sm text-gray-600 mt-1">
                                          <span className="font-semibold">Suggestion:</span>{' '}
                                          {match.replacements[0].value}
                                        </p>
                                      )}
                                    </div>
                                    
                                    <div className="ml-4">
                                      {isFixed ? (
                                        <span className="text-green-600 flex items-center">
                                          <FiCheck className="mr-1" /> Done
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => handleFix(match, match.replacements[0].value)}
                                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 flex items-center"
                                        >
                                          <FiCheck className="mr-1" /> Done
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )
                      )}
                    </>
                  )}

                  {suggestions.length > 0 && (
                    <>
                      <h2 className="bg-yellow-100 p-3 font-bold text-yellow-800">Suggestions</h2>
                      
                      {Object.entries(suggestionGroups).map(
                        ([sentence, matches], idx) => (
                          <div key={`sugg-${idx}`} className="p-4 border-b">
                            <p className="mb-3 text-gray-700">{sentence}</p>
                            
                            <div className="space-y-3">
                              {matches.map((match, matchIdx) => (
                                <div key={`sugg-match-${matchIdx}`} className="flex items-start">
                                  <div className="flex-1">
                                    <p className="font-medium text-yellow-600">
                                      {match.message}
                                    </p>
                                    {match.replacements.length > 0 && (
                                      <p className="text-sm text-gray-600 mt-1">
                                        <span className="font-semibold">Possible improvements:</span>{' '}
                                        {match.replacements.map(r => r.value).join(', ')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 bg-green-50 text-green-700 rounded-lg">
                  No issues found! Your text looks great.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GrammarChecker;