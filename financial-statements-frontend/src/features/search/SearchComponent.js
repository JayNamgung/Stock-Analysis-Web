import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SearchComponent.css';

const SearchComponent = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (query.length > 1) {
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/v1/companies/search?query=${query}`);
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSearch = (company) => {
    // 여기에 검색 로직 구현
    console.log('Searching for:', company);
    setQuery('');
    setSuggestions([]);
  };

  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="기업명 또는 종목코드 입력"
        className="search-input"
      />
      {suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((company) => (
            <li key={company.corp_code} onClick={() => handleSearch(company)}>
              {company.corp_name} ({company.stock_code})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchComponent;