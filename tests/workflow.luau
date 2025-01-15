local folder = workspace:WaitForChild("Folder") :: Folder

local helloWorld = folder:FindFirstChild("HelloWorld")
if not helloWorld then
	error("HelloWorld not found")
end
