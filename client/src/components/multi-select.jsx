import React from "react";
import Select from "react-select";

const MultiSelect = ({ options, selected, onChange, placeholder }) => {
  return (
    <Select
      isMulti
      options={options}
      value={selected}
      onChange={onChange}
      placeholder={placeholder}
      className="react-select-container"
      classNamePrefix="react-select"
    />
  );
};

export default MultiSelect;
