import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function LogCatchForm() {
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    location: "",
    species: "",
    length_in: "",
    weight_lbs: "",
    weather: "",
    bait: ""
  });

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from("catches")
      .insert([{ ...formData }]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("✅ Catch logged!");
      setFormData({
        date: "",
        time: "",
        location: "",
        species: "",
        length_in: "",
        weight_lbs: "",
        weather: "",
        bait: ""
      });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="date" name="date" value={formData.date} onChange={handleChange} required />
      <input type="time" name="time" value={formData.time} onChange={handleChange} required />
      <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange} required />
      <input type="text" name="species" placeholder="Species" value={formData.species} onChange={handleChange} required />
      <input type="number" step="0.01" name="length_in" placeholder="Length (inches)" value={formData.length_in} onChange={handleChange} required />
      <input type="number" step="0.01" name="weight_lbs" placeholder="Weight (lbs)" value={formData.weight_lbs} onChange={handleChange} required />
      <input type="text" name="weather" placeholder="Weather" value={formData.weather} onChange={handleChange} />
      <input type="text" name="bait" placeholder="Bait Used" value={formData.bait} onChange={handleChange} />
      <button type="submit">Log Catch</button>
    </form>
  );
}