export function getChartConfig(labels, datasets) {
  return {
    labels: labels,
    datasets: datasets
  };
}

export function makeErrorJson(dataArr, stdArr) {
  let errorJsonData = dataArr.map((val, idx) => {
    const y = Number(val);
    const yMax = Number((y + Number(stdArr[idx])).toFixed(2));
    const yMin = Number(Math.max(0, y - Number(stdArr[idx])).toFixed(2));
    return {
      y,
      yMax,
      yMin
    };
  });

  return errorJsonData;
}

export const scoreOption = {
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: { max: 5, beginAtZero: true }
  }
};
export const noLegendOption = {
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: { beginAtZero: true }
  }
};

export function histogramOption(offset) {
  return {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => {
            if (!items.length) return '';
            const item = items[0];
            const x = item.parsed.x;
            if (x === 0) return '0';
            let min = x - offset <= 0 ? 0 : x - offset;
            let max = x + offset;
            return `${min}-${max}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        offset: false,
        grid: { offset: false },
        ticks: { stepSize: offset * 2 }
      },
      y: { beginAtZero: true }
    }
  };
}

export function getScatterOption(yMax = null) {
  return {
    borderColor: 'transparent',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => {
            return items[0].raw.y;
          },
          label: (item) => {
            return item.raw.tooltip;
          }
        }
      }
    },
    scales: _getScatterScale(yMax)
  };
}

const _getScatterScale = (yMax = null) => {
  const scale = {
    x: {
      ticks: {
        stepSize: 1
      }
    },
    y: {
      beginAtZero: true
    }
  };
  if (yMax) scale.y['max'] = yMax;
  return scale;
};
