local folder = workspace:WaitForChild("Folder") :: Folder
if not folder then
	error("Folder not found")
end

local childNames = {}
for _, child in folder:GetChildren() do
	table.insert(childNames, child.Name)
end

return childNames
