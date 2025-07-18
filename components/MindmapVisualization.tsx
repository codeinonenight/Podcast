'use client'

import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface MindmapNode {
  id: string
  label: string
  group: number
  level: number
  x?: number
  y?: number
  fx?: number
  fy?: number
}

interface MindmapLink {
  source: string
  target: string
}

interface MindmapData {
  centralTopic: string
  branches: Array<{
    name: string
    subtopics: string[]
    connections: string[]
  }>
}

interface MindmapVisualizationProps {
  data: MindmapData
  width?: number
  height?: number
}

export const MindmapVisualization: React.FC<MindmapVisualizationProps> = ({ 
  data, 
  width = 800, 
  height = 600 
}) => {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!data || !svgRef.current) return

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove()

    // Process data into nodes and links
    const nodes: MindmapNode[] = []
    const links: MindmapLink[] = []

    // Central node
    const centralNode: MindmapNode = {
      id: 'central',
      label: data.centralTopic,
      group: 0,
      level: 0
    }
    nodes.push(centralNode)

    // Branch nodes
    data.branches.forEach((branch, branchIndex) => {
      const branchId = `branch-${branchIndex}`
      const branchNode: MindmapNode = {
        id: branchId,
        label: branch.name,
        group: branchIndex + 1,
        level: 1
      }
      nodes.push(branchNode)

      // Link to central node
      links.push({
        source: 'central',
        target: branchId
      })

      // Subtopic nodes
      branch.subtopics.forEach((subtopic, subIndex) => {
        const subtopicId = `subtopic-${branchIndex}-${subIndex}`
        const subtopicNode: MindmapNode = {
          id: subtopicId,
          label: subtopic,
          group: branchIndex + 1,
          level: 2
        }
        nodes.push(subtopicNode)

        // Link to branch node
        links.push({
          source: branchId,
          target: subtopicId
        })
      })
    })

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])

    // Create color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))

    // Create links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#64748b')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.7)

    // Create nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .call(d3.drag<SVGGElement, MindmapNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = undefined
          d.fy = undefined
        })
      )

    // Add circles to nodes
    node.append('circle')
      .attr('r', (d) => d.level === 0 ? 25 : d.level === 1 ? 20 : 15)
      .attr('fill', (d) => colorScale(d.group.toString()))
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 2)

    // Add labels to nodes
    node.append('text')
      .text((d) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', (d) => d.level === 0 ? '14px' : d.level === 1 ? '12px' : '10px')
      .attr('font-weight', (d) => d.level === 0 ? 'bold' : d.level === 1 ? '600' : 'normal')
      .attr('fill', '#ffffff')
      .attr('pointer-events', 'none')
      .each(function(d) {
        const textElement = d3.select(this)
        const words = d.label.split(' ')
        const maxWidth = d.level === 0 ? 40 : d.level === 1 ? 35 : 25
        
        if (words.length > 1) {
          textElement.text('')
          words.forEach((word, i) => {
            textElement.append('tspan')
              .attr('x', 0)
              .attr('dy', i === 0 ? 0 : '1.2em')
              .text(word)
          })
        }
      })

    // Add hover effects
    node.on('mouseover', function(event, d: MindmapNode) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', (d.level === 0 ? 25 : d.level === 1 ? 20 : 15) + 5)
        .attr('stroke-width', 3)
      
      // Highlight connected links
      link.attr('stroke-opacity', (l: any) => 
        l.source.id === d.id || l.target.id === d.id ? 1 : 0.3
      )
    })
    .on('mouseout', function(event, d: MindmapNode) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', d.level === 0 ? 25 : d.level === 1 ? 20 : 15)
        .attr('stroke-width', 2)
      
      // Reset link opacity
      link.attr('stroke-opacity', 0.7)
    })

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

    // Cleanup function
    return () => {
      simulation.stop()
    }
  }, [data, width, height])

  return (
    <div className="w-full bg-slate-800 rounded-lg p-4 overflow-hidden">
      <svg ref={svgRef} className="w-full h-auto max-h-[600px]" />
      <div className="mt-4 text-sm text-slate-400 text-center">
        <p>Drag nodes to rearrange • Hover to highlight connections</p>
      </div>
    </div>
  )
}