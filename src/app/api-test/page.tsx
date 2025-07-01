"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/auth/session-context";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export default function APITestPage() {
  const { session, loading } = useSession();
  const [testResult, setTestResult] = useState<string>("");
  const [devToken, setDevToken] = useState<string>("");

  const createTestUser = async () => {
    try {
      setTestResult("Creating test user...");
      
      const response = await fetch('/api/test/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          displayName: 'Test User'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTestResult(`Test user created!\nUser ID: ${data.user.id}\nTeam ID: ${data.team.id}\nBoard ID: ${data.board.id}`);
        toast.success("Test user created successfully");
      } else {
        setTestResult(`Error: ${data.error}`);
        toast.error("Failed to create test user");
      }
      
    } catch (error: any) {
      setTestResult(`Error: ${error.message}`);
      toast.error("Failed to create test user");
    }
  };

  const getDevAuth = async () => {
    try {
      setTestResult("Getting development auth...");
      
      const response = await fetch('/api/test/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setDevToken(data.access_token);
        setTestResult(`Development auth created!\nUser: ${data.user.email}\nToken: ${data.access_token.substring(0, 30)}...`);
        toast.success("Development auth created");
      } else {
        setTestResult(`Error: ${data.error}`);
        toast.error("Failed to create dev auth");
      }
      
    } catch (error: any) {
      setTestResult(`Error: ${error.message}`);
      toast.error("Failed to create dev auth");
    }
  };

  const testAPI = async () => {
    const token = devToken || session?.access_token;
    
    if (!token) {
      setTestResult("No authentication token available. Please get dev auth or sign in.");
      return;
    }
    
    try {
      setTestResult("Testing API...");
      
      // Test teams endpoint
      const teamsResponse = await fetch('/api/teams', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        console.log("Teams:", teamsData);
        
        if (teamsData.teams && teamsData.teams.length > 0) {
          const team = teamsData.teams[0];
          setTestResult(`Found team: ${team.name} (${team.id})`);
          
          // Test boards
          const boardsResponse = await fetch(`/api/teams/${team.id}/boards`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (boardsResponse.ok) {
            const boardsData = await boardsResponse.json();
            console.log("Boards:", boardsData);
            
            if (boardsData.boards && boardsData.boards.length > 0) {
              const board = boardsData.boards[0];
              setTestResult(prev => prev + `\nFound board: ${board.name} (${board.id})`);
              
              // Test lists - this is where the 500 error was occurring
              try {
                const listsResponse = await fetch(`/api/teams/${team.id}/boards/${board.id}/lists`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (listsResponse.ok) {
                  const listsData = await listsResponse.json();
                  console.log("Lists:", listsData);
                  setTestResult(prev => prev + `\nFound ${listsData.lists?.length || 0} lists`);
                  
                  // Test creating a new list
                  const createListResponse = await fetch(`/api/teams/${team.id}/boards/${board.id}/lists`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: "Test List " + Date.now() })
                  });
                  
                  if (createListResponse.ok) {
                    const newListData = await createListResponse.json();
                    console.log("Created list:", newListData);
                    setTestResult(prev => prev + `\nCreated test list: ${newListData.list.name}`);
                  } else {
                    const error = await createListResponse.json();
                    setTestResult(prev => prev + `\nList creation error: ${error.error}`);
                  }
                  
                } else {
                  const error = await listsResponse.json();
                  setTestResult(prev => prev + `\nLists error: ${error.error}`);
                }
                
              } catch (listError: any) {
                setTestResult(prev => prev + `\nList error: ${listError.message}`);
              }
            } else {
              setTestResult(prev => prev + "\nNo boards found");
            }
          } else {
            const error = await boardsResponse.json();
            setTestResult(prev => prev + `\nBoards error: ${error.error}`);
          }
        } else {
          setTestResult("No teams found");
        }
      } else {
        const error = await teamsResponse.json();
        setTestResult(`Teams error: ${error.error}`);
      }
      
      toast.success("API test completed");
      
    } catch (error: any) {
      setTestResult(`Error: ${error.message}`);
      toast.error("API test failed");
    }
  };

  if (loading) {
    return <div>Loading session...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">API Test</h1>
      
      <div className="space-y-2">
        <p><strong>Session User:</strong> {session?.user?.email || 'None'}</p>
        <p><strong>Session Token:</strong> {session?.access_token ? `${session.access_token.substring(0, 20)}...` : 'None'}</p>
        <p><strong>Dev Token:</strong> {devToken ? `${devToken.substring(0, 20)}...` : 'None'}</p>
      </div>
      
      <div className="space-y-4">
        <Button onClick={createTestUser}>Create Test User</Button>
        <Button onClick={getDevAuth}>Get Dev Auth</Button>
        <Button onClick={testAPI}>Test API</Button>
      </div>
      
      {testResult && (
        <div className="p-4 border rounded">
          <pre>{testResult}</pre>
        </div>
      )}
    </div>
  );
}
