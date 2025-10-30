from flask import Flask, send_file, request, jsonify
import collections
import heapq
import time

app = Flask(__name__, static_folder='.', static_url_path='')

DIRECTIONS = [(0, 1), (0, -1), (1, 0), (-1, 0)]

def is_valid(x, y, rows, cols, maze):
    return 0 <= x < rows and 0 <= y < cols and maze[x][y] != 1

def reconstruct_path(parent, start, end):
    path = []
    current = end
    while current != start:
        path.append(current)
        current = parent[current]
    path.append(start)
    return path[::-1]

def solve_bfs(maze, start, end):
    rows, cols = len(maze), len(maze[0])
    queue = collections.deque([start])
    visited = set([start])
    parent = {}
    visited_cells = []
    
    start_time = time.perf_counter() # Using perf_counter for higher precision
    while queue:
        current = queue.popleft()
        visited_cells.append(current)
        
        if current == end:
            end_time = time.perf_counter()
            return visited_cells, reconstruct_path(parent, start, end), end_time - start_time
        
        for dx, dy in DIRECTIONS:
            neighbor = (current[0] + dx, current[1] + dy)
            if is_valid(neighbor[0], neighbor[1], rows, cols, maze) and neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
                parent[neighbor] = current
                
    end_time = time.perf_counter()
    return visited_cells, [], end_time - start_time

def solve_dfs(maze, start, end):
    rows, cols = len(maze), len(maze[0])
    stack = [start]
    visited = set([start])
    parent = {}
    visited_cells = []

    start_time = time.perf_counter()
    while stack:
        current = stack.pop()
        visited_cells.append(current)

        if current == end:
            end_time = time.perf_counter()
            return visited_cells, reconstruct_path(parent, start, end), end_time - start_time

        for dx, dy in DIRECTIONS:
            neighbor = (current[0] + dx, current[1] + dy)
            if is_valid(neighbor[0], neighbor[1], rows, cols, maze) and neighbor not in visited:
                visited.add(neighbor)
                stack.append(neighbor)
                parent[neighbor] = current
    
    end_time = time.perf_counter()
    return visited_cells, [], end_time - start_time

def solve_dijkstra(maze, start, end):
    rows, cols = len(maze), len(maze[0])
    pq = [(0, start)]
    distances = { (r, c): float('inf') for r in range(rows) for c in range(cols) }
    distances[start] = 0
    parent = {}
    visited_cells = []

    start_time = time.perf_counter()
    while pq:
        cost, current = heapq.heappop(pq)
        
        if cost > distances[current]:
            continue

        visited_cells.append(current)

        if current == end:
            end_time = time.perf_counter()
            return visited_cells, reconstruct_path(parent, start, end), end_time - start_time

        for dx, dy in DIRECTIONS:
            neighbor = (current[0] + dx, current[1] + dy)
            if is_valid(neighbor[0], neighbor[1], rows, cols, maze):
                new_cost = cost + 1
                if new_cost < distances[neighbor]:
                    distances[neighbor] = new_cost
                    heapq.heappush(pq, (new_cost, neighbor))
                    parent[neighbor] = current
                    
    end_time = time.perf_counter()
    return visited_cells, [], end_time - start_time

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/solve', methods=['POST'])
def solve():
    data = request.json
    maze_grid = data['grid']
    start_point = tuple(data['start'])
    end_point = tuple(data['end'])
    algorithm = data['algorithm']

    visited_cells = []
    path = []
    time_taken = 0
    
    if algorithm == 'bfs':
        visited_cells, path, time_taken = solve_bfs(maze_grid, start_point, end_point)
    elif algorithm == 'dfs':
        visited_cells, path, time_taken = solve_dfs(maze_grid, start_point, end_point)
    elif algorithm == 'dijkstra':
        visited_cells, path, time_taken = solve_dijkstra(maze_grid, start_point, end_point)

    visited_cells = [list(cell) for cell in visited_cells]
    path = [list(cell) for cell in path]
    
    return jsonify({
        'visited_cells': visited_cells,
        'path': path,
        'time_taken': time_taken 
    })
@app.after_request
def inject_vercel_analytics(response):
    if response.content_type.startswith('text/html'):
        response.data = response.data.replace(b'<!-- VERCEL_ANALYTICS -->', b"<script>window.va = window.va || function () { (window.va.q = window.va.q || []).push(arguments); };</script><script defer src='/_vercel/insights/script.js'></script>")
    return response
if __name__ == '__main__':
    app.run(debug=True)
