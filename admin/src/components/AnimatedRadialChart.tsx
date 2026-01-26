import React from 'react'
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts'
import { Box, Typography, keyframes } from '@mui/material'

interface AnimatedRadialChartProps {
  title: string
  value: number
  total: number
  color: string
  secondaryColor?: string
  icon?: React.ReactNode
  subtitle?: string
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const AnimatedRadialChart: React.FC<AnimatedRadialChartProps> = ({
  title,
  value,
  total,
  color,
  secondaryColor = '#e0e0e0',
  icon,
  subtitle,
}) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0

  const data = [
    {
      name: title,
      value: percentage,
      fill: color,
    },
  ]

  return (
    <Box
      sx={{
        width: '100%',
        animation: `${fadeIn} 0.6s ease-out`,
      }}
    >
      {/* Chart Container */}
      <Box 
        sx={{ 
          position: 'relative', 
          width: '100%', 
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1,
        }}
      >
        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            barSize={16}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: secondaryColor }}
              dataKey="value"
              cornerRadius={10}
              animationDuration={1500}
              animationBegin={0}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center Content - Absolutely Positioned */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          {icon && (
            <Box sx={{ color, fontSize: 28, mb: 0.5 }}>
              {icon}
            </Box>
          )}
          <Typography
            sx={{
              fontWeight: 900,
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.75rem',
              lineHeight: 1,
            }}
          >
            {value}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: '0.7rem',
              display: 'block',
              mt: 0.25,
            }}
          >
            / {total}
          </Typography>
        </Box>
      </Box>

      {/* Bottom Info */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            fontSize: '0.9rem',
            mb: 0.5,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem',
              display: 'block',
              mb: 1,
            }}
          >
            {subtitle}
          </Typography>
        )}
        <Box
          sx={{
            display: 'inline-flex',
            px: 2,
            py: 0.5,
            bgcolor: `${color}15`,
            borderRadius: 1.5,
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              color,
              fontSize: '1rem',
            }}
          >
            {percentage}%
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default AnimatedRadialChart
