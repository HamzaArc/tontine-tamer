
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data
const TONTINE_DATA = [
  { id: '1', name: 'Family Savings' },
  { id: '2', name: 'Friends Group' },
  { id: '3', name: 'Work Colleagues' },
  { id: '4', name: 'Neighborhood Fund' },
];

const CYCLE_PERFORMANCE_DATA = [
  { name: 'Cycle 1', onTime: 8, late: 0, missed: 0 },
  { name: 'Cycle 2', onTime: 7, late: 1, missed: 0 },
  { name: 'Cycle 3', onTime: 6, late: 2, missed: 0 },
  { name: 'Cycle 4', onTime: 5, late: 2, missed: 1 },
  { name: 'Cycle 5', onTime: 7, late: 1, missed: 0 },
  { name: 'Cycle 6', onTime: 6, late: 2, missed: 0 },
];

const PAYMENT_STATUS_DATA = [
  { name: 'On Time', value: 39, color: '#4ade80' },
  { name: 'Late', value: 8, color: '#facc15' },
  { name: 'Missed', value: 1, color: '#f87171' },
];

const COLORS = ['#4ade80', '#facc15', '#f87171'];

const TontinePerformance: React.FC = () => {
  const [selectedTontine, setSelectedTontine] = useState(TONTINE_DATA[0].id);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <h2 className="text-xl font-semibold">Tontine Performance Analysis</h2>
        
        <Select
          value={selectedTontine}
          onValueChange={setSelectedTontine}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Select Tontine" />
          </SelectTrigger>
          <SelectContent>
            {TONTINE_DATA.map((tontine) => (
              <SelectItem key={tontine.id} value={tontine.id}>
                {tontine.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Payment Performance by Cycle</CardTitle>
            <CardDescription>
              Number of payments received on time, late, or missed for each cycle
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={CYCLE_PERFORMANCE_DATA}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                stackOffset="sign"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [`${value} payments`, name]}
                  labelFormatter={(value) => `${value}`}
                />
                <Legend />
                <Bar dataKey="onTime" name="On Time" stackId="a" fill="#4ade80" />
                <Bar dataKey="late" name="Late" stackId="a" fill="#facc15" />
                <Bar dataKey="missed" name="Missed" stackId="a" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Payment Status Distribution</CardTitle>
            <CardDescription>
              Overall distribution of payment statuses
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PAYMENT_STATUS_DATA}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {PAYMENT_STATUS_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} payments`, name]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Key Performance Insights</CardTitle>
            <CardDescription>
              Important metrics and insights about this tontine's performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Payment Reliability</h3>
                <p className="text-4xl font-bold text-green-500">95%</p>
                <p className="text-sm text-muted-foreground">
                  Percentage of payments made on time or late (not missed)
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Average Collection Time</h3>
                <p className="text-4xl font-bold">3.2 <span className="text-lg">days</span></p>
                <p className="text-sm text-muted-foreground">
                  Average time to collect payments after due date
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Member Retention</h3>
                <p className="text-4xl font-bold text-primary">100%</p>
                <p className="text-sm text-muted-foreground">
                  Percentage of members who have remained active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TontinePerformance;
