import React from 'react';
import styled from 'styled-components';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Input = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      handleSearch();
    }
  };

  const handleSearch = () => {
    if (search.trim()) {
      console.log("Searching for:", search);
      navigate(`/profile/${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <StyledWrapper>
      <div className="input__container">
        <div className="shadow__input" />
        <button 
          className="input__button__shadow" 
          onClick={handleSearch}
          aria-label="Search"
        >
          <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" height="20px" width="20px">
            <path d="M4 9a5 5 0 1110 0A5 5 0 014 9zm5-7a7 7 0 104.2 12.6.999.999 0 00.093.107l3 3a1 1 0 001.414-1.414l-3-3a.999.999 0 00-.107-.093A7 7 0 009 2z" fillRule="evenodd" fill="#17202A" />
          </svg>
        </button>
        <input 
          type="text" 
          name="text" 
          className="input__search" 
          placeholder="Ask AI or search" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Search input"
        />
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .input__container {
    position: relative;
    background: rgba(255, 255, 255, 0.664);
    padding: 5px 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
    border-radius: 22px;
    max-width: 300px;
    margin-left:20px
  }



  .input__button__shadow {
    cursor: pointer;
    border: none;
    background: none;
    transition: transform 400ms, background 400ms;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 12px;
    padding: 5px;
  }

  .input__button__shadow:hover {
    background: rgba(255, 255, 255, 0.411);
  }

  .input__search {
    width: 100%;
    border-radius: 20px;
    outline: none;
    border: none;
    padding: 8px;
    position: relative;
  }`;

export default Input;
