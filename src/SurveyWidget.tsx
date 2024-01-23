import React, { useState, useEffect } from 'react';
import {
  StagePanelLocation,
  UiItemsProvider,
  Widget,
  WidgetState
} from "@itwin/appui-react";
import { mongoAppApi } from "./common/mongo";
import { Pie } from 'react-chartjs-2';
import Chart from 'chart.js/auto';


// SurveyWidget component
const SurveyWidget: React.FC = () => {
  const [results, setResults] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await mongoAppApi.getVotingResults();
        setResults(response);
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
      await mongoAppApi.submitVote(option);
      // Optionally, refetch or update results
      // Fetch results again to update the chart
      const updatedResults = await mongoAppApi.getVotingResults();
      setResults(updatedResults);
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


    {Object.keys(results).length > 0 && (
        <Pie data={data} />
        )}    
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



