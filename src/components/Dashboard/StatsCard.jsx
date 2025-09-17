import React from 'react';
import PropTypes from 'prop-types';

const StatsCard = ({ icon: Icon, title, value, change, trend }) => {
  return (
    <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 md:p-6 transform hover:scale-[1.01] transition-all duration-300">
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className={`
          bg-gradient-to-r ${trend === 'up' ? 'from-red-500 to-red-600' : 'from-red-400 to-red-500'}
          w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-lg
        `}>
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <span className={`
          text-xs md:text-sm font-medium px-2 py-1 rounded-lg
          ${trend === 'up' ? 'text-green-400 bg-green-400/20' : 'text-red-400 bg-red-400/20'}
        `}>
          {change}
        </span>
      </div>
      
      <h3 className="text-white/90 text-sm font-medium mb-1">{title}</h3>
      <p className="text-xl md:text-2xl font-bold text-white">{value}</p>
    </div>
  );
};

StatsCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  change: PropTypes.string.isRequired,
  trend: PropTypes.oneOf(['up', 'down']).isRequired
};

export default StatsCard;