import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AbaSimulacao.css';

export default function AbaSimulacao() {
  const navigate = useNavigate();

  const handleClique = () => {
    // Passamos o estado 'abrirRelatorio' como true para a próxima página
    navigate('/simulador-veiculo', { state: { abrirRelatorio: true } });
  };

  return (
    <div className="aba-simulacao-container" onClick={handleClique}>
      <div className="aba-simulacao-content">
        <i className="fa-solid fa-truck-ramp-box"></i>
        <span>Simular Veículo</span>
      </div>
    </div>
  );
}