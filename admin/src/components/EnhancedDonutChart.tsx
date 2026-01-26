import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { Box, Typography } from '@mui/material'

interface ChartData {
  name: string
  value: number
  color: string
  [key: string]: string | number // Index signature for additional properties
}

interface EnhancedDonutChartProps {
  data: ChartData[]
  title?: string
  showLegend?: boolean
  showLabels?: boolean
  innerRadius?: number
  outerRadius?: number
  height?: number
}

const EnhancedDonutChart: React.FC<EnhancedDonutChartProps> = ({
  data,
  title,
  showLegend = true,
  showLabels = false, // Changed default to false
  innerRadius = 80,
  outerRadius = 130,
  height = 350,
}) => {
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    name,
    index,
  }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{
          fontSize: '14px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        <tspan x={x} dy="-0.5em" style={{ fontSize: '11px', fontWeight: 600 }}>
          {name}
        </tspan>
        <tspan x={x} dy="1.2em" style={{ fontSize: '18px', fontWeight: 700 }}>
          {`0${index + 1}`}
        </tspan>
      </text>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: 'rgba(0, 0, 0, 0.85)',
            color: 'white',
            p: 2,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            border: `2px solid ${payload[0].payload.color}`,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
            {payload[0].name}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, color: payload[0].payload.color }}>
            {payload[0].value}
          </Typography>
        </Box>
      )
    }
    return null
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {title && (
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#2F5233' }}>
          {title}
        </Typography>
      )}
      {/* Chart - Fixed Height */}
      <Box sx={{ flex: '0 0 auto', height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey="value"
              label={showLabels ? renderCustomLabel : false}
              labelLine={false}
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="none"
                  style={{
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
                    transition: 'all 0.3s',
                  }}
                />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </Box>
      
      {/* Legend - Scrollable, Separate from Chart */}
      {showLegend && (
        <Box 
          sx={{ 
            flex: '1 1 auto',
            display: 'flex', 
            flexDirection: 'column', 
            gap: 1.5, 
            mt: 3,
            maxHeight: 200,
            overflowY: 'auto',
            pr: 1,
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: 'rgba(0,0,0,0.05)',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'rgba(0,0,0,0.2)',
              borderRadius: '10px',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.3)',
              },
            },
          }}
        >
          {data.map((entry, index) => (
            <Box
              key={`legend-${index}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 2,
                py: 1,
                borderRadius: 2,
                bgcolor: 'rgba(0,0,0,0.02)',
                transition: 'all 0.2s',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.05)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '4px',
                  bgcolor: entry.color,
                  boxShadow: `0 2px 8px ${entry.color}40`,
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                  {entry.name}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: entry.color }}>
                {entry.value}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default EnhancedDonutChart
