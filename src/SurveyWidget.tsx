import React, { useState, useEffect } from 'react';
import {
  StagePanelLocation,
  UiItemsProvider,
  Widget,
  WidgetState
} from "@itwin/appui-react";
import { mongoAppApi } from "./common/mongo";
import { Pie } from 'react-chartjs-2';
import { ChartData, ChartDataset } from 'chart.js';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, PieController } from 'chart.js';

// Registering the required components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, PieController);


// SurveyWidget component
const SurveyWidget: React.FC = () => {
  const [results, setResults] = useState<PieChartData>({
    labels: ['Parking Lot', 'Children Playground', 'Greenery Area', 'Gym Equipment'],
    datasets: [
        {
            label: '# of Votes',
            data: [0, 0, 0, 0],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)'
            ],
            borderWidth: 1
        }
    ]
});

interface PieChartData {
    labels: string[];
    datasets: ChartDataset<'pie'>[];
}
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await mongoAppApi.getVotingResults();
      } catch (error) {
        console.error("Failed to fetch results:", error);
      }
    };

    fetchResults();
  }, []);

 const data = {
    labels: Object.keys(results),
    datasets: [
      {
        label: 'Voting Results',
        data: Object.values(results),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          // Add more colors if you have more options
        ],
        hoverOffset: 4,
      },
    ],
  };


  const handleVote = async (option: string) => {
    try {
      const updatedResults = await mongoAppApi.submitVote(option);
      // Optionally, refetch or update results
      // Fetch results again to update the chart

         // Transform the object into chart data
      const newData = results.datasets[0].data.map((_, index: any) => {
           const label = results.labels[index];
           return updatedResults[label] || 0;
       });
    
       setResults((prevChartData: any) => ({
                ...prevChartData,
                datasets: [{ ...prevChartData.datasets[0], data: newData }]
            }));
    } catch (error) {
      console.error("Failed to submit vote:", error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
    <h2>What do you want to see more in your city?</h2>
    <button style={{ margin: '5px 0' }} onClick={() => handleVote('Parking Lot')}>Parking Lot</button>
    <button style={{ margin: '5px 0' }} onClick={() => handleVote('Children Playground')}>Children Playground</button>
    <button style={{ margin: '5px 0' }} onClick={() => handleVote('Greenery Area')}>Greenery Area</button>
    <button style={{ margin: '5px 0' }} onClick={() => handleVote('Gym Equipment')}>Gym Equipment</button>
    <Pie data={results} />
    </div>
  );
};

// SurveyUiProvider class
export class SurveyUiProvider implements UiItemsProvider {
  public readonly id = "SurveyUiProvider";

  public provideWidgets(_stageId: string, _stageUsage: string, location: StagePanelLocation): ReadonlyArray<Widget> {
    const widgets: Widget[] = [];

    if (location === StagePanelLocation.Right) {
      widgets.push({
        id: "SurveyWidget",
        label: "Public Survey",
        defaultState: WidgetState.Open,
        content: <SurveyWidget />
      });
    }

    return widgets;
  }
}



