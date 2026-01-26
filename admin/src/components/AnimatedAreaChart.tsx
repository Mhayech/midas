import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import { Box, Typography } from '@mui/material'

interface ChartData {
  name: string
  earnings: number
}

interface AnimatedAreaChartProps {
  data: ChartData[]
  title: string
  totalValue: number
  formatCurrency: (value: number) => string
  color?: string
  gradientId?: string
}

const CustomTooltip = ({ active, payload, formatCurrency }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          bgcolor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          p: 2,
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#4CAF50' }}>
          {payload[0].payload.name}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {formatCurrency(payload[0].value)}
        </Typography>
      </Box>
    )
  }
  return null
}

const AnimatedAreaChart: React.FC<AnimatedAreaChartProps> = ({
  data,
  title,
  totalValue,
  formatCurrency,
  color = '#4CAF50',
  gradientId = 'colorEarnings',
}) => {
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
          }}
        >
          {title}
        </Typography>
        <Box
          sx={{
            px: 2,
            py: 0.75,
            bgcolor: `${color}15`,
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color,
            }}
          >
            {formatCurrency(totalValue)}
          </Typography>
        </Box>
      </Box>
      <ResponsiveContainer width="100%" height={280} minHeight={280}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#999"
            style={{ fontSize: '0.75rem', fontWeight: 600 }}
            tickLine={false}
          />
          <YAxis
            stroke="#999"
            style={{ fontSize: '0.75rem', fontWeight: 600 }}
            tickLine={false}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <RechartsTooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
          <Area
            type="monotone"
            dataKey="earnings"
            stroke={color}
            strokeWidth={3}
            fill={`url(#${gradientId})`}
            animationDuration={1500}
            animationBegin={0}
            dot={{
              fill: color,
              stroke: '#fff',
              strokeWidth: 2,
              r: 5,
            }}
            activeDot={{
              r: 7,
              stroke: '#fff',
              strokeWidth: 2,
              fill: color,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}

export default AnimatedAreaChart
